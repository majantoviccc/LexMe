defmodule Lexme.Messages do
  @moduledoc """
  Context for managing thread messages.
  """

  import Ecto.Query, warn: false

  alias Lexme.Messages.Message
  alias Lexme.Repo
  alias Lexme.Threads.Thread

  def list_messages do
    Repo.all(Message)
  end

  def list_messages_by_thread(thread_id) do
    Message
    |> where([m], m.thread_id == ^thread_id)
    |> order_by([m], asc: m.inserted_at)
    |> Repo.all()
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

  def delete_message(id) do
    case Repo.get(Message, id) do
      nil -> {:error, :not_found}
      message -> Repo.delete(message)
    end
  end
end
