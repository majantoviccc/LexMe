defmodule LexmeWeb.ChatChannelStream do
  use Phoenix.Channel

  # ============================================================
  # JOIN
  # ============================================================

  @impl true
  def join("chat:lobby", _payload, socket) do
    {:ok, socket}
  end

  # ============================================================
  # HANDLE PROMPT FROM CLIENT
  # ============================================================

  @impl true
  def handle_in("prompt", %{"prompt" => prompt}, socket) do
    Task.start(fn ->
      stream_gemini(prompt, socket)
    end)

    {:noreply, socket}
  end

  # ============================================================
  # GEMINI STREAMING
  # ============================================================

  defp stream_gemini(prompt, socket) do
    case Gemini.start_stream(prompt) do
      {:ok, stream_id} ->
        Gemini.subscribe_stream(stream_id)

        receive_stream_events(stream_id, socket)

      {:error, error} ->
        push(socket, "error", %{
          error: inspect(error)
        })
    end
  end

  # ============================================================
  # RECEIVE STREAM EVENTS
  # ============================================================

  defp receive_stream_events(stream_id, socket) do
    receive do
      {:stream_event, ^stream_id, %{type: :data, data: data}} ->
        text = extract_text_from_chunk(data)

        if text && text != "" do
          push(socket, "chunk", %{
            text: text
          })
        end

        receive_stream_events(stream_id, socket)

      {:stream_complete, ^stream_id} ->
        push(socket, "done", %{})

      {:stream_error, ^stream_id, error} ->
        push(socket, "error", %{
          error: inspect(error)
        })
    after
      30_000 ->
        push(socket, "error", %{
          error: "Stream timeout"
        })
    end
  end

  # ============================================================
  # TEXT EXTRACTION
  # ============================================================

  defp extract_text_from_chunk(%{
         "candidates" => [
           %{
             "content" => %{
               "parts" => parts
             }
           }
           | _
         ]
       }) do
    parts
    |> Enum.find(&Map.has_key?(&1, "text"))
    |> case do
      %{"text" => text} -> text
      _ -> nil
    end
  end

  defp extract_text_from_chunk(_), do: nil
end
