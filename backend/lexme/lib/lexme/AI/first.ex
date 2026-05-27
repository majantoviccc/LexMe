defmodule Lexme.AI.First do
  def first() do
    # Basic text generation
    {:ok, response} = Gemini.generate("Tell me about Elixir programming")
    {:ok, text} = Gemini.extract_text(response)
    IO.puts(text)

    # With options
    {:ok, response} =
      Gemini.generate("Explain quantum computing",
        model: "gemini-flash-lite-latest",
        temperature: 0.7,
        max_output_tokens: 1000
      )

    # Advanced generation config with structured output
    {:ok, response} =
      Gemini.generate("Analyze this topic and provide a summary",
        response_json_schema: %{
          "type" => "object",
          "properties" => %{
            "summary" => %{"type" => "string"},
            "key_points" => %{"type" => "array", "items" => %{"type" => "string"}},
            "confidence" => %{"type" => "number"}
          }
        },
        response_mime_type: "application/json",
        temperature: 0.3
      )
  end
end
