defmodule LexmeWeb.ProjectJSON do
  def index(%{projects: projects}) do
    %{data: Enum.map(projects, &project/1)}
  end

  def show(%{project: project}) do
    %{data: project(project)}
  end

  def project(project) do
    %{
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      inserted_at: project.inserted_at,
      updated_at: project.updated_at
    }
  end
end
