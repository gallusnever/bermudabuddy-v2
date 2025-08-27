"""labels metadata and applications batch

Revision ID: 0006
Revises: 0005
Create Date: 2025-08-26
"""

from alembic import op
import sqlalchemy as sa


revision = '0006'
down_revision = '0005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # labels: add signal_word and rup
    with op.batch_alter_table('labels') as batch_op:
        batch_op.add_column(sa.Column('signal_word', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('rup', sa.Boolean(), nullable=True))

    # applications: add batch_id
    with op.batch_alter_table('applications') as batch_op:
        batch_op.add_column(sa.Column('batch_id', sa.String(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('applications') as batch_op:
        batch_op.drop_column('batch_id')
    with op.batch_alter_table('labels') as batch_op:
        batch_op.drop_column('rup')
        batch_op.drop_column('signal_word')

