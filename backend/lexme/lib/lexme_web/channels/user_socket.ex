# LexMe/backend/lexme/lib/lexme_web/channels/user_socket.ex
defmodule LexmeWeb.UserSocket do
  use Phoenix.Socket

  # All chat:* topics are handled by ChatChannel
  channel "chat:*", LexmeWeb.ChatChannel

  @impl true
  def connect(_params, socket, _connect_info) do
    # No auth for now — accept all connections
    {:ok, socket}
  end

  @impl true
  def id(_socket), do: nil
end
