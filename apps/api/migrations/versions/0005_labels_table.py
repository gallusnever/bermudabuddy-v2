"""add labels table

Revision ID: 0005
Revises: 0004
Create Date: 2025-08-26
"""

from alembic import op
import sqlalchemy as sa


revision = '0005'
down_revision = '0004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'labels',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('product_id', sa.String, nullable=True),
        sa.Column('epa_reg_no', sa.String, nullable=True),
        sa.Column('pdf_url', sa.String, nullable=True),
        sa.Column('source', sa.String, nullable=True),
        sa.Column('retrieved_at', sa.String, nullable=True),
        sa.Column('state_reg_json', sa.JSON, nullable=True),
    )


def downgrade() -> None:
    op.drop_table('labels')

