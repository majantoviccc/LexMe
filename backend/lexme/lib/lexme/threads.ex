defmodule Lexme.Threads do
  @moduledoc """
  Context for managing discussion threads.
  """

  alias Lexme.Projects.Project
  alias Lexme.Repo
  alias Lexme.Threads.Thread

  def list_threads do
    Repo.all(Thread)
  end

  def get_thread!(id) do
    Repo.get!(Thread, id)
    |> Repo.preload([:project, :messages])
  end

  def create_thread(attrs \\ %{}) do
    case Repo.get(Project, attrs["project_id"] || attrs[:project_id]) do
      %Project{} ->
        %Thread{}
        |> Thread.changeset(attrs)
        |> Repo.insert()

      _ ->
        {:error, :project_not_found}
    end
  end

  def delete_thread(id) do
    case Repo.get(Thread, id) do
      nil -> {:error, :not_found}
      thread -> Repo.delete(thread)
    end
  end
end
