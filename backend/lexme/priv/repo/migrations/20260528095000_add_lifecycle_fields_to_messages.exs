defmodule Lexme.Repo.Migrations.AddLifecycleFieldsToMessages do
  use Ecto.Migration

  def change do
    alter table(:messages) do
      add :status, :string, null: false, default: "complete"
      add :error, :text
      add :model, :string
      add :prompt_tokens, :integer
      add :completion_tokens, :integer
    end

    create index(:messages, [:status])

    create constraint(:messages, :messages_status_check,
             check: "status IN ('pending', 'streaming', 'complete', 'failed')"
           )
  end
end
