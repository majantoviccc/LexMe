defmodule Lexme.Projects.Project do
  use Ecto.Schema
  import Ecto.Changeset

  schema "projects" do
    field :name, :string
    field :description, :string
    field :status, :string, default: "active"

    has_many :threads, Lexme.Threads.Thread

    timestamps(type: :utc_datetime)
  end

  def changeset(project, attrs) do
    project
    |> cast(attrs, [:name, :description, :status])
    |> validate_required([:name])
    |> validate_length(:name, min: 2)
    |> validate_inclusion(:status, ["active", "archived"])
  end
end
