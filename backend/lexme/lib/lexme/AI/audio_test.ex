defmodule AudioTest do
  alias Gemini.Live.Session
  alias Gemini.Live.Models

  def run do
    model = Models.resolve(:audio)

    {:ok, session} =
      Session.start_link(
        model: model,
        auth: :gemini,
        generation_config: %{
          response_modalities: ["AUDIO"]
        },
        output_audio_transcription: %{},
        system_instruction: "You are a helpful assistant.",
        on_message: fn
          %{server_content: content} when not is_nil(content) ->
            if text = Gemini.Types.Live.ServerContent.extract_text(content) do
              IO.write(text)
            end

            if content.turn_complete do
              IO.puts("\n")
            end

          _ ->
            :ok
        end
      )

    :ok = Session.connect(session)

    Session.send_text(session, "What is machine learning?")

    Process.sleep(10_000)

    Session.close(session)
  end
end
