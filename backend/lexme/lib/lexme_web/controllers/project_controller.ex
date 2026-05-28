defmodule LexmeWeb.ProjectController do
  use LexmeWeb, :controller

  alias Lexme.Projects

  def index(conn, _params) do
    projects = Projects.list_projects()
    json(conn, %{data: projects})
  end

  def show(conn, %{"id" => id}) do
    project = Projects.get_project!(id)
    json(conn, %{data: project})
  end

  def create(conn, params) do
    case Projects.create_project(params) do
      {:ok, project} ->
        conn
        |> put_status(:created)
        |> json(%{data: project})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: translate_errors(changeset)})
    end
  end

  def delete(conn, %{"id" => id}) do
    case Projects.delete_project(id) do
      {:ok, _project} ->
        send_resp(conn, :no_content, "")

      {:error, :not_found} ->
        send_resp(conn, :not_found, "")

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: translate_errors(changeset)})
    end
  end

  defp translate_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end
end
