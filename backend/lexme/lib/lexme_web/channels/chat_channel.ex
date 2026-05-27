defmodule LexmeWeb.ChatChannel do
  use Phoenix.Channel

  def join("chat:lobby", _, socket) do
    {:ok, socket}
  end

  def handle_in(
        "send_message",
        %{"message" => message},
        socket
      ) do
    Task.start(fn ->
      stream_gemini(message)
    end)

    {:noreply, socket}
  end

  defp stream_gemini(message) do
    case Gemini.stream_generate(
           message,
           model: "gemini-2.5-flash"
         ) do
      {:ok, chunks} ->
        Enum.each(chunks, fn chunk ->
          token =
            chunk["candidates"]
            |> List.first()
            |> get_in([
              "content",
              "parts",
              Access.at(0),
              "text"
            ])

          LexmeWeb.Endpoint.broadcast(
            "chat:lobby",
            "token",
            %{token: token}
          )
        end)

        LexmeWeb.Endpoint.broadcast(
          "chat:lobby",
          "complete",
          %{}
        )

      {:error, reason} ->
        IO.inspect(reason)
    end
  end
end
