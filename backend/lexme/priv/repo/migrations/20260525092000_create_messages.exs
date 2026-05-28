defmodule Lexme.Repo.Migrations.CreateMessages do
  use Ecto.Migration

  def change do
    create table(:messages) do
      add :role, :string, null: false
      add :content, :text, null: false
      add :metadata, :map, null: false, default: %{}
      add :thread_id, references(:threads, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:messages, [:thread_id])
    create index(:messages, [:role])

    create constraint(:messages, :messages_role_check,
             check: "role IN ('user', 'assistant', 'system')"
           )
  end
end
