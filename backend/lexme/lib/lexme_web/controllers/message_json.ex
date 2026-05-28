defmodule LexmeWeb.MessageJSON do
  def index(%{messages: messages}) do
    %{data: Enum.map(messages, &message/1)}
  end

  def show(%{message: message}) do
    %{data: message(message)}
  end

  def message(message) do
    %{
      id: message.id,
      role: message.role,
      content: message.content,
      metadata: message.metadata,
      thread_id: message.thread_id,
      inserted_at: message.inserted_at,
      updated_at: message.updated_at
    }
  end
end
