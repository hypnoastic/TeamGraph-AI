"""add onboarding and context control-plane tables

Revision ID: 20260622_01
Revises:
"""
from alembic import op
from sqlalchemy import inspect

from models import Base


revision = "20260622_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)
    inspector = inspect(bind)
    if "users" in inspector.get_table_names():
        organization_column = next(
            (column for column in inspector.get_columns("users") if column["name"] == "organization_id"),
            None,
        )
        if organization_column and not organization_column["nullable"]:
            op.alter_column("users", "organization_id", existing_type=organization_column["type"], nullable=True)
    if "activity_events" in inspector.get_table_names():
        organization_column = next(
            (column for column in inspector.get_columns("activity_events") if column["name"] == "organization_id"),
            None,
        )
        if organization_column and not organization_column["nullable"]:
            op.alter_column(
                "activity_events",
                "organization_id",
                existing_type=organization_column["type"],
                nullable=True,
            )


def downgrade() -> None:
    for table_name in ["approval_items", "context_records", "raw_context_uploads", "invitations"]:
        if table_name in inspect(op.get_bind()).get_table_names():
            op.drop_table(table_name)
