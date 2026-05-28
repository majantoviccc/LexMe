defmodule LexmeWeb.ThreadJSON do
  def index(%{threads: threads}) do
    %{data: Enum.map(threads, &thread/1)}
  end

  def show(%{thread: thread}) do
    %{data: thread(thread)}
  end

  def thread(thread) do
    %{
      id: thread.id,
      title: thread.title,
      status: thread.status,
      project_id: thread.project_id,
      inserted_at: thread.inserted_at,
      updated_at: thread.updated_at
    }
  end
end
