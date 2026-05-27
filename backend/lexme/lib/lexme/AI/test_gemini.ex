defmodule TestGemini do
  def run do
    with {:ok, response} <- Gemini.generate("Tell me about Elixir"),
         {:ok, text} <- Gemini.extract_text(response) do
      IO.puts(text)
    else
      {:error, reason} ->
        IO.inspect(reason, label: "Gemini error")
    end
  end
end
