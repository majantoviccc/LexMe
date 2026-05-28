defmodule LexmeWeb.MessageController do
  use LexmeWeb, :controller

  alias Lexme.Messages

  def index(conn, %{"thread_id" => thread_id}) do
    messages = Messages.list_messages_by_thread(thread_id)
    render(conn, :index, messages: messages)
  end

  def index(conn, _params) do
    messages = Messages.list_messages()
    render(conn, :index, messages: messages)
  end

  def create(conn, params) do
    case Messages.create_message(params) do
      {:ok, message} ->
        conn
        |> put_status(:created)
        |> render(:show, message: message)

      {:error, :thread_not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{errors: %{thread_id: ["thread not found"]}})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: translate_errors(changeset)})
    end
  end

  def delete(conn, %{"id" => id}) do
    case Messages.delete_message(id) do
      {:ok, _message} ->
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
