defmodule Lexme.Repo.Migrations.CreateThreads do
  use Ecto.Migration

  def change do
    create table(:threads) do
      add :title, :string, null: false
      add :status, :string, null: false, default: "open"
      add :project_id, references(:projects, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:threads, [:project_id])
    create constraint(:threads, :threads_status_check, check: "status IN ('open', 'closed')")
  end
end
