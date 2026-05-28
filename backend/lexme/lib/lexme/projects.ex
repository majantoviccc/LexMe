defmodule Lexme.Projects do
  @moduledoc """
  Context for managing projects.
  """

  alias Lexme.Projects.Project
  alias Lexme.Repo

  def list_projects do
    Repo.all(Project)
  end

  def get_project!(id) do
    Repo.get!(Project, id)
    |> Repo.preload(threads: [:messages])
  end

  def create_project(attrs \\ %{}) do
    %Project{}
    |> Project.changeset(attrs)
    |> Repo.insert()
  end

  def delete_project(id) do
    case Repo.get(Project, id) do
      nil -> {:error, :not_found}
      project -> Repo.delete(project)
    end
  end
end
