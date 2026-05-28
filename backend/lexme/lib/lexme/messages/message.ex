defmodule Lexme.Messages.Message do
  use Ecto.Schema
  import Ecto.Changeset

  schema "messages" do
    field :role, :string
    field :content, :string
    field :metadata, :map, default: %{}
    field :status, :string, default: "complete"
    field :error, :string
    field :model, :string
    field :prompt_tokens, :integer
    field :completion_tokens, :integer

    belongs_to :thread, Lexme.Threads.Thread

    timestamps(type: :utc_datetime)
  end

  def changeset(message, attrs) do
    message
    |> cast(attrs, [
      :role,
      :content,
      :metadata,
      :thread_id,
      :status,
      :error,
      :model,
      :prompt_tokens,
      :completion_tokens
    ])
    |> validate_required([:role, :content, :thread_id])
    |> validate_inclusion(:role, ["user", "assistant", "system"])
    |> validate_inclusion(:status, ["pending", "streaming", "complete", "failed"])
    |> validate_number(:prompt_tokens, greater_than_or_equal_to: 0)
    |> validate_number(:completion_tokens, greater_than_or_equal_to: 0)
    |> assoc_constraint(:thread)
  end
end
