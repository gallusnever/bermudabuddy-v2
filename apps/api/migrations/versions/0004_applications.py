"""add applications table

Revision ID: 0004
Revises: 0003
Create Date: 2025-08-26
"""

from alembic import op
import sqlalchemy as sa


revision = '0004'
down_revision = '0003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'applications',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('property_id', sa.Integer, sa.ForeignKey('properties.id'), nullable=False),
        sa.Column('product_id', sa.String, nullable=False),
        sa.Column('date', sa.Date, nullable=True),
        sa.Column('rate_value', sa.Float, nullable=True),
        sa.Column('rate_unit', sa.String, nullable=True),
        sa.Column('area_sqft', sa.Float, nullable=True),
        sa.Column('carrier_gpa', sa.Float, nullable=True),
        sa.Column('tank_size_gal', sa.Float, nullable=True),
        sa.Column('gdd_model', sa.String, nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('weather_snapshot', sa.JSON, nullable=True),
    )


def downgrade() -> None:
    op.drop_table('applications')

