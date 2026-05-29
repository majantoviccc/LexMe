# # LexMe/backend/lexme/lib/lexme/gemini_service.ex
# defmodule Lexme.GeminiService do
#   require Logger

#   @base_url "https://generativelanguage.googleapis.com/v1beta"

#   @doc """
#   Starts a non-blocking Task that streams a Gemini response chunk-by-chunk.

#   Options:
#     * `:message_id` — opaque identifier echoed back in every reply message,
#       so the channel/UI can route chunks to the right assistant message.
#     * `:system_instruction` — string passed as Gemini `systemInstruction`
#       (used for guardrails / persona).

#   Sends to `pid`:
#     * `{:ai_chunk, message_id, text}` for each token
#     * `{:ai_done, message_id}` on completion
#     * `{:ai_error, message_id, reason}` on failure
#   """
#   def stream_chat(messages, pid, opts \\ []) do
#     message_id = Keyword.get(opts, :message_id)
#     system_instruction = Keyword.get(opts, :system_instruction)
#     Task.start(fn -> do_stream(messages, pid, message_id, system_instruction) end)
#   end

#   # ── Private ──

#   defp do_stream(messages, pid, message_id, system_instruction) do
#     api_key = Application.get_env(:lexme, :gemini_api_key)
#     model = Application.get_env(:lexme, :gemini_model, "gemini-2.0-flash")

#     if is_nil(api_key) or api_key == "" do
#       send(pid, {:ai_error, message_id, "GEMINI_API_KEY is not set"})
#       :error
#     else
#       url = "#{@base_url}/models/#{model}:streamGenerateContent?key=#{api_key}&alt=sse"

#       body =
#         messages
#         |> build_body(system_instruction)
#         |> Jason.encode!()

#       request =
#         Finch.build(
#           :post,
#           url,
#           [
#             {"content-type", "application/json"},
#             {"accept", "text/event-stream"}
#           ],
#           body
#         )

#       # acc is the SSE line buffer — data arrives in raw TCP chunks that may
#       # split across SSE event boundaries, so we accumulate and drain.
#       # Finch.stream/5 expects the callback to return the new acc directly
#       # (it wraps it in {:cont, _} internally before calling stream_while).
#       result =
#         Finch.stream(
#           request,
#           Lexme.Finch,
#           %{buffer: "", status: 200},
#           fn
#             {:status, status}, acc ->
#               %{acc | status: status}

#             {:headers, _headers}, acc ->
#               acc

#             {:data, data}, acc ->
#               if acc.status != 200 do
#                 Logger.warning("[GeminiService] Non-200 status #{acc.status}: #{data}")
#                 acc
#               else
#                 buffer = acc.buffer <> data
#                 {texts, remaining} = extract_sse_chunks(buffer)
#                 Enum.each(texts, fn text -> send(pid, {:ai_chunk, message_id, text}) end)
#                 %{acc | buffer: remaining}
#               end
#           end,
#           receive_timeout: 60_000
#         )

#       case result do
#         {:ok, _acc} ->
#           send(pid, {:ai_done, message_id})

#         {:error, reason} ->
#           Logger.error("[GeminiService] Finch error: #{inspect(reason)}")
#           send(pid, {:ai_error, message_id, inspect(reason)})
#       end
#     end
#   end

#   defp build_body(messages, system_instruction) do
#     base = %{
#       contents: messages,
#       generationConfig: %{
#         temperature: 0.7,
#         maxOutputTokens: 2048
#       }
#     }

#     if is_binary(system_instruction) and system_instruction != "" do
#       Map.put(base, :systemInstruction, %{parts: [%{text: system_instruction}]})
#     else
#       base
#     end
#   end

#   # Split the raw buffer on SSE event delimiters ("\n\n").
#   # Returns {[text], remaining_incomplete_buffer}.
#   defp extract_sse_chunks(buffer) do
#     case String.split(buffer, "\n\n") do
#       [incomplete] ->
#         {[], incomplete}

#       parts ->
#         remaining = List.last(parts)
#         complete_events = Enum.drop(parts, -1)
#         texts = Enum.flat_map(complete_events, &parse_sse_event/1)
#         {texts, remaining}
#     end
#   end

#   # A single SSE event looks like:
#   #   data: {"candidates":[{"content":{"parts":[{"text":"Hello"}],...},...}],...}
#   defp parse_sse_event(event) do
#     event
#     |> String.split("\n")
#     |> Enum.filter(&String.starts_with?(&1, "data: "))
#     |> Enum.flat_map(fn "data: " <> json ->
#       case Jason.decode(json) do
#         {:ok, %{"candidates" => candidates}} ->
#           Enum.flat_map(candidates, fn
#             %{"content" => %{"parts" => parts}} ->
#               parts
#               |> Enum.filter(&Map.has_key?(&1, "text"))
#               |> Enum.map(& &1["text"])

#             _ ->
#               []
#           end)

#         _ ->
#           []
#       end
#     end)
#   end
# end
