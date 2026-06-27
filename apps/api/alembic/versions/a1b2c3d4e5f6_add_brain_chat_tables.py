"""Add brain chat tables

Revision ID: a1b2c3d4e5f6
Revises: 564efb5ef432
Create Date: 2026-06-27
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "564efb5ef432"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "brain_conversations",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("organization_id", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_brain_conversations_user_id", "brain_conversations", ["user_id"])
    op.create_index("ix_brain_conversations_organization_id", "brain_conversations", ["organization_id"])

    op.create_table(
        "brain_messages",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("conversation_id", sa.String(length=64), nullable=False),
        sa.Column("role", sa.String(length=16), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("payload_json", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["conversation_id"], ["brain_conversations.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_brain_messages_conversation_id", "brain_messages", ["conversation_id"])


def downgrade() -> None:
    op.drop_index("ix_brain_messages_conversation_id", table_name="brain_messages")
    op.drop_table("brain_messages")
    op.drop_index("ix_brain_conversations_organization_id", table_name="brain_conversations")
    op.drop_index("ix_brain_conversations_user_id", table_name="brain_conversations")
    op.drop_table("brain_conversations")
