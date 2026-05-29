defmodule LexmeWeb.ThreadController do
  use LexmeWeb, :controller

  alias Lexme.Threads

  def index(conn, _params) do
    threads = Threads.list_threads()
    render(conn, :index, threads: threads)
  end

  def show(conn, %{"id" => id}) do
    case Threads.get_thread(id) do
      {:ok, thread} ->
        render(conn, :show, thread: thread)

      {:error, :not_found} ->
        send_resp(conn, :not_found, "")
    end
  end

  def create(conn, params) do
    case Threads.create_thread(params) do
      {:ok, thread} ->
        conn
        |> put_status(:created)
        |> render(:show, thread: thread)

      {:error, :project_not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{errors: %{project_id: ["project not found"]}})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: translate_errors(changeset)})
    end
  end

  def delete(conn, %{"id" => id}) do
    case Threads.delete_thread(id) do
      {:ok, _thread} ->
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
