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

  def create_user(conn, params) do
    case Messages.create_user_message(params) do
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

  def create_assistant_placeholder(conn, params) do
    case Messages.create_assistant_placeholder(params) do
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

  def append_chunk(conn, %{"id" => id, "chunk" => chunk}) do
    case Messages.append_message_content(id, chunk) do
      {:ok, message} ->
        render(conn, :show, message: message)

      {:error, :not_found} ->
        send_resp(conn, :not_found, "")

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: translate_errors(changeset)})
    end
  end

  def append_chunk(conn, _params) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{errors: %{chunk: ["is required"]}})
  end

  def mark_complete(conn, %{"id" => id} = params) do
    attrs =
      Map.take(params, ["model", "prompt_tokens", "completion_tokens", "metadata", "content"])

    case Messages.mark_message_complete(id, attrs) do
      {:ok, message} ->
        render(conn, :show, message: message)

      {:error, :not_found} ->
        send_resp(conn, :not_found, "")

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: translate_errors(changeset)})
    end
  end

  def mark_failed(conn, %{"id" => id, "error" => error_text}) do
    case Messages.mark_message_failed(id, error_text) do
      {:ok, message} ->
        render(conn, :show, message: message)

      {:error, :not_found} ->
        send_resp(conn, :not_found, "")

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: translate_errors(changeset)})
    end
  end

  def mark_failed(conn, _params) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{errors: %{error: ["is required"]}})
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
