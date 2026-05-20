defmodule Lexme.Repo do
  use Ecto.Repo,
    otp_app: :lexme,
    adapter: Ecto.Adapters.Postgres
end
