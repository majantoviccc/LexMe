defmodule LexmeWeb.PageController do
  use LexmeWeb, :controller

  def home(conn, _params) do
    render(conn, :home)
  end
end
