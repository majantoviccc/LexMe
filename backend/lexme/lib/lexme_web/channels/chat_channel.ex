# LexMe/backend/lexme/lib/lexme_web/channels/chat_channel.ex
defmodule LexmeWeb.ChatChannel do
  use LexmeWeb, :channel
  require Logger

  @system_prompt """
  Ti si LexMe — AI asistent specijalizovan iskljucivo za pravo Crne Gore.
  Odgovaras na pitanja vezana za crnogorske zakone, propise, sudsku praksu,
  Ustav, pravne procedure, prava i obaveze i institucije.

  Ako te neko pita o necem sto NIJE vezano za pravo Crne Gore (npr. kuvanje,
  programiranje, opste znanje, drugi pravni sistemi), ljubazno odbij i predlozi
  povezano pravno pitanje na koje mozes da odgovoris.

  Odgovaras na jeziku korisnika (crnogorski / srpski / hrvatski / bosanski).
  Tvoji odgovori su informativni. Uvijek napomeni da je za konkretne pravne
  situacije neophodna konsultacija sa kvalifikovanim advokatom u Crnoj Gori.
  """

  @impl true
  def join("chat:" <> _room_id, _payload, socket) do
    {:ok, socket}
  end

  # Client sends:
  #   %{
  #     "history" => [...Gemini-format messages...],
  #     "message_id" => "uuid"   # the assistant placeholder id (echoed back in each event)
  #   }
  @impl true
  def handle_in("new_message", %{"history" => history} = payload, socket) do
    message_id = Map.get(payload, "message_id")
    channel_pid = self()

    Lexme.GeminiService.stream_chat(history, channel_pid,
      message_id: message_id,
      system_instruction: @system_prompt
    )

    {:noreply, socket}
  end

  # ── Messages from the GeminiService Task ──

  @impl true
  def handle_info({:ai_chunk, message_id, text}, socket) do
    push(socket, "ai_chunk", %{message_id: message_id, text: text})
    {:noreply, socket}
  end

  @impl true
  def handle_info({:ai_done, message_id}, socket) do
    push(socket, "ai_done", %{message_id: message_id})
    {:noreply, socket}
  end

  @impl true
  def handle_info({:ai_error, message_id, reason}, socket) do
    Logger.error("[ChatChannel] AI error: #{reason}")
    push(socket, "ai_error", %{message_id: message_id, reason: reason})
    {:noreply, socket}
  end
end
