"""add pgr last fields to properties

Revision ID: 0003
Revises: 0002
Create Date: 2025-08-26
"""

from alembic import op
import sqlalchemy as sa

revision = '0003'
down_revision = '0002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('properties', sa.Column('pgr_last_gdd0', sa.Date(), nullable=True))
    op.add_column('properties', sa.Column('pgr_last_gdd10', sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column('properties', 'pgr_last_gdd10')
    op.drop_column('properties', 'pgr_last_gdd0')

