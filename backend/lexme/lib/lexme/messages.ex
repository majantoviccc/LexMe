defmodule Lexme.Messages do
  @moduledoc """
  Context for managing thread messages.
  """

  import Ecto.Query, warn: false

  alias Lexme.Messages.Message
  alias Lexme.Repo
  alias Lexme.Threads.Thread

  @preloads []

  def list_messages do
    Repo.all(Message)
  end

  def list_messages_by_thread(thread_id) do
    Message
    |> where([m], m.thread_id == ^thread_id)
    |> order_by([m], asc: m.inserted_at)
    |> Repo.all()
  end

  def get_message(id) do
    case Repo.get(Message, id) do
      nil -> {:error, :not_found}
      message -> {:ok, Repo.preload(message, @preloads)}
    end
  end

  def create_message(attrs \\ %{}) do
    case Repo.get(Thread, attrs["thread_id"] || attrs[:thread_id]) do
      %Thread{} ->
        %Message{}
        |> Message.changeset(attrs)
        |> Repo.insert()

      _ ->
        {:error, :thread_not_found}
    end
  end

  def create_user_message(attrs \\ %{}) do
    attrs
    |> Map.new()
    |> Map.put_new("role", "user")
    |> Map.put_new("status", "complete")
    |> create_message()
  end

  def create_assistant_placeholder(attrs \\ %{}) do
    attrs
    |> Map.new()
    |> Map.put_new("role", "assistant")
    |> Map.put_new("content", "")
    |> Map.put_new("status", "pending")
    |> create_message()
  end

  def append_message_content(id, chunk) when is_binary(chunk) do
    case Repo.get(Message, id) do
      nil ->
        {:error, :not_found}

      message ->
        message
        |> Message.changeset(%{
          content: (message.content || "") <> chunk,
          status: "streaming"
        })
        |> Repo.update()
    end
  end

  def mark_message_complete(id, attrs \\ %{}) do
    update_message_state(id, Map.put(Map.new(attrs), "status", "complete"))
  end

  def mark_message_failed(id, error_text) do
    update_message_state(id, %{"status" => "failed", "error" => error_text})
  end

  def delete_message(id) do
    case Repo.get(Message, id) do
      nil -> {:error, :not_found}
      message -> Repo.delete(message)
    end
  end

  defp update_message_state(id, attrs) do
    case Repo.get(Message, id) do
      nil ->
        {:error, :not_found}

      message ->
        message
        |> Message.changeset(Map.new(attrs))
        |> Repo.update()
    end
  end
end
