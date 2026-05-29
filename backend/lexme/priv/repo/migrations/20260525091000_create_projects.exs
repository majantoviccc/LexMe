defmodule Lexme.Repo.Migrations.CreateProjects do
  use Ecto.Migration

  def change do
    create table(:projects) do
      add :name, :string, null: false
      add :description, :text
      add :status, :string, null: false, default: "active"

      timestamps(type: :utc_datetime)
    end

    create constraint(:projects, :projects_status_check,
             check: "status IN ('active', 'archived')"
           )
  end
end
