"""init stations with postgis

Revision ID: 0001
Revises: 
Create Date: 2025-08-26
"""

from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geography


# revision identifiers, used by Alembic.
revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
    op.create_table(
        'stations',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('provider', sa.String, nullable=False),
        sa.Column('name', sa.String, nullable=False),
        sa.Column('lat', sa.Float, nullable=False),
        sa.Column('lon', sa.Float, nullable=False),
        sa.Column('state', sa.String, nullable=False),
        sa.Column('has_soil_temp', sa.Boolean, nullable=False, server_default=sa.text('false')),
        sa.Column('depth_in', sa.JSON, nullable=True),
        sa.Column('geom', Geography(geometry_type='POINT', srid=4326), nullable=False),
        sa.Column('priority', sa.Integer, nullable=False, server_default='0'),
        sa.Column('metadata_json', sa.JSON, nullable=True),
    )


def downgrade() -> None:
    op.drop_table('stations')

