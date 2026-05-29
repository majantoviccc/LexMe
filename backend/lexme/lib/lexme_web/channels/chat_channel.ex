defmodule LexmeWeb.ChatChannel do
  use Phoenix.Channel

  @impl true
  def join("chat:lobby", _payload, socket) do
    {:ok, socket}
  end

  @impl true
  def handle_in("prompt", %{"prompt" => prompt}, socket) do
    parent = self()

    Task.start(fn ->
      case Gemini.start_stream(prompt) do
        {:ok, stream_id} ->
          Gemini.subscribe_stream(stream_id)

          stream_loop(parent, stream_id)

        {:error, error} ->
          send(parent, {:stream_error, error})
      end
    end)

    {:noreply, socket}
  end

  defp stream_loop(parent, stream_id) do
    receive do
      {:stream_event, ^stream_id, %{type: :data, data: data}} ->
        text = extract_text_from_chunk(data)

        if text && text != "" do
          send(parent, {:stream_chunk, text})
        end

        stream_loop(parent, stream_id)

      {:stream_complete, ^stream_id} ->
        send(parent, :stream_complete)

      {:stream_error, ^stream_id, error} ->
        send(parent, {:stream_error, error})
    end
  end

  defp extract_text_from_chunk(data) do
    case get_in(data, ["candidates", Access.at(0), "content", "parts"]) do
      [%{"text" => text} | _] -> text
      _ -> nil
    end
  end

  @impl true
  def handle_info({:stream_chunk, chunk}, socket) do
    push(socket, "chunk", %{
      text: chunk
    })

    {:noreply, socket}
  end

  @impl true
  def handle_info(:stream_complete, socket) do
    push(socket, "done", %{})

    {:noreply, socket}
  end

  @impl true
  def handle_info({:stream_error, error}, socket) do
    push(socket, "error", %{
      error: inspect(error)
    })

    {:noreply, socket}
  end
end
