# LexMe/backend/lexme/lib/lexme/gemini_service.ex
defmodule Lexme.GeminiService do
  require Logger

  @base_url "https://generativelanguage.googleapis.com/v1beta"

  @doc """
  Starts a non-blocking Task that streams a Gemini response chunk-by-chunk.
  Each chunk is sent as {:ai_chunk, text} to `pid`.
  On completion: :ai_done. On error: {:ai_error, reason}.
  """
  def stream_chat(messages, pid) do
    Task.start(fn -> do_stream(messages, pid) end)
  end

  # ── Private ──

  defp do_stream(messages, pid) do
    api_key = Application.get_env(:lexme, :gemini_api_key)
    model = Application.get_env(:lexme, :gemini_model, "gemini-2.0-flash")

    if is_nil(api_key) or api_key == "" do
      send(pid, {:ai_error, "GEMINI_API_KEY is not set"})
      :error
    else
      url = "#{@base_url}/models/#{model}:streamGenerateContent?key=#{api_key}&alt=sse"

      body =
        Jason.encode!(%{
          contents: messages,
          generationConfig: %{
            temperature: 0.9,
            maxOutputTokens: 2048
          }
        })

      request =
        Finch.build(
          :post,
          url,
          [
            {"content-type", "application/json"},
            {"accept", "text/event-stream"}
          ],
          body
        )

      # acc is the SSE line buffer — data arrives in raw TCP chunks that may
      # split across SSE event boundaries, so we accumulate and drain.
      result =
        Finch.stream(
          request,
          Lexme.Finch,
          %{buffer: "", status: 200},
          fn
            {:status, status}, acc ->
              {:cont, %{acc | status: status}}

            {:headers, _headers}, acc ->
              {:cont, acc}

            {:data, data}, acc ->
              if acc.status != 200 do
                Logger.warning("[GeminiService] Non-200 status #{acc.status}: #{data}")
                {:cont, acc}
              else
                buffer = acc.buffer <> data
                {texts, remaining} = extract_sse_chunks(buffer)
                Enum.each(texts, fn text -> send(pid, {:ai_chunk, text}) end)
                {:cont, %{acc | buffer: remaining}}
              end
          end,
          receive_timeout: 60_000
        )

      case result do
        {:ok, _acc} ->
          send(pid, :ai_done)

        {:error, reason} ->
          Logger.error("[GeminiService] Finch error: #{inspect(reason)}")
          send(pid, {:ai_error, inspect(reason)})
      end
    end
  end

  # Split the raw buffer on SSE event delimiters ("\n\n").
  # Returns {[text], remaining_incomplete_buffer}.
  defp extract_sse_chunks(buffer) do
    case String.split(buffer, "\n\n") do
      [incomplete] ->
        {[], incomplete}

      parts ->
        remaining = List.last(parts)
        complete_events = Enum.drop(parts, -1)
        texts = Enum.flat_map(complete_events, &parse_sse_event/1)
        {texts, remaining}
    end
  end

  # A single SSE event looks like:
  #   data: {"candidates":[{"content":{"parts":[{"text":"Hello"}],...},...}],...}
  defp parse_sse_event(event) do
    event
    |> String.split("\n")
    |> Enum.filter(&String.starts_with?(&1, "data: "))
    |> Enum.flat_map(fn "data: " <> json ->
      case Jason.decode(json) do
        {:ok, %{"candidates" => candidates}} ->
          Enum.flat_map(candidates, fn
            %{"content" => %{"parts" => parts}} ->
              parts
              |> Enum.filter(&Map.has_key?(&1, "text"))
              |> Enum.map(& &1["text"])

            _ ->
              []
          end)

        _ ->
          []
      end
    end)
  end
end
