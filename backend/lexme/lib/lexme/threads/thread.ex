defmodule Lexme.Threads.Thread do
  use Ecto.Schema
  import Ecto.Changeset

  schema "threads" do
    field :title, :string
    field :status, :string, default: "open"

    belongs_to :project, Lexme.Projects.Project
    has_many :messages, Lexme.Messages.Message

    timestamps(type: :utc_datetime)
  end

  def changeset(thread, attrs) do
    thread
    |> cast(attrs, [:title, :status, :project_id])
    |> validate_required([:title, :project_id])
    |> validate_inclusion(:status, ["open", "closed"])
    |> assoc_constraint(:project)
  end
end
