defmodule Lexme.Messages.Message do
  use Ecto.Schema
  import Ecto.Changeset

  schema "messages" do
    field :role, :string
    field :content, :string
    field :metadata, :map, default: %{}

    belongs_to :thread, Lexme.Threads.Thread

    timestamps(type: :utc_datetime)
  end

  def changeset(message, attrs) do
    message
    |> cast(attrs, [:role, :content, :metadata, :thread_id])
    |> validate_required([:role, :content, :thread_id])
    |> validate_inclusion(:role, ["user", "assistant", "system"])
    |> assoc_constraint(:thread)
  end
end
