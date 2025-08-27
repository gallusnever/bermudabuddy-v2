"""add properties and polygons

Revision ID: 0002
Revises: 0001
Create Date: 2025-08-26
"""

from alembic import op
import sqlalchemy as sa


revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'properties',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', sa.String, nullable=True),
        sa.Column('address', sa.String, nullable=False),
        sa.Column('lat', sa.Float, nullable=True),
        sa.Column('lon', sa.Float, nullable=True),
        sa.Column('timezone', sa.String, nullable=True),
        sa.Column('program_goal', sa.String, nullable=True),
        sa.Column('irrigation', sa.String, nullable=True),
        sa.Column('cultivar', sa.String, nullable=True),
        sa.Column('mower', sa.String, nullable=True),
        sa.Column('hoc_in', sa.Float, nullable=True),
        sa.Column('state', sa.String, nullable=True),
    )
    op.create_table(
        'polygons',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('property_id', sa.Integer, sa.ForeignKey('properties.id'), nullable=False),
        sa.Column('name', sa.String, nullable=False),
        sa.Column('geojson', sa.Text, nullable=True),
        sa.Column('area_sqft', sa.Float, nullable=True),
    )


def downgrade() -> None:
    op.drop_table('polygons')
    op.drop_table('properties')

