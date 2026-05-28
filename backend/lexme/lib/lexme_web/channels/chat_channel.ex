# LexMe/backend/lexme/lib/lexme_web/channels/chat_channel.ex
defmodule LexmeWeb.ChatChannel do
  use LexmeWeb, :channel
  require Logger

  @impl true
  def join("chat:" <> _room_id, _payload, socket) do
    {:ok, socket}
  end

  # Client sends: %{"history" => [...gemini-format messages...]}
  @impl true
  def handle_in("new_message", %{"history" => history}, socket) do
    # Capture channel pid before spawning — Task runs in a different process
    channel_pid = self()

    # stream_chat is non-blocking (starts a Task internally)
    Lexme.GeminiService.stream_chat(history, channel_pid)

    {:noreply, socket}
  end

  # ── Messages from the GeminiService Task ──

  @impl true
  def handle_info({:ai_chunk, text}, socket) do
    push(socket, "ai_chunk", %{text: text})
    {:noreply, socket}
  end

  @impl true
  def handle_info(:ai_done, socket) do
    push(socket, "ai_done", %{})
    {:noreply, socket}
  end

  @impl true
  def handle_info({:ai_error, reason}, socket) do
    Logger.error("[ChatChannel] AI error: #{reason}")
    push(socket, "ai_error", %{reason: reason})
    {:noreply, socket}
  end
end
