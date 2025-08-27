from typing import Optional, Any
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, JSON, Integer
from geoalchemy2 import Geography


class Station(SQLModel, table=True):
    __tablename__ = "stations"

    id: Optional[int] = Field(default=None, primary_key=True)
    provider: str
    name: str
    lat: float
    lon: float
    state: str
    has_soil_temp: bool = Field(default=False)
    depth_in: Optional[list[int]] = Field(default=None, sa_column=Column(JSON))
    geom: Any = Field(sa_column=Column(Geography(geometry_type="POINT", srid=4326)))
    priority: int = Field(default=0)
    metadata_json: Optional[dict] = Field(default=None, sa_column=Column(JSON))


class Property(SQLModel, table=True):
    __tablename__ = "properties"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[str] = None
    address: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    timezone: Optional[str] = None
    program_goal: Optional[str] = None
    irrigation: Optional[str] = None
    cultivar: Optional[str] = None
    mower: Optional[str] = None
    hoc_in: Optional[float] = None
    state: Optional[str] = None
    pgr_last_gdd0: Optional[str] = None
    pgr_last_gdd10: Optional[str] = None


class Polygon(SQLModel, table=True):
    __tablename__ = "polygons"

    id: Optional[int] = Field(default=None, primary_key=True)
    property_id: int = Field(foreign_key="properties.id")
    name: str
    geojson: Optional[str] = None
    area_sqft: Optional[float] = None


class Label(SQLModel, table=True):
    __tablename__ = "labels"

    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: Optional[str] = None
    epa_reg_no: Optional[str] = None
    pdf_url: Optional[str] = None
    source: Optional[str] = None
    retrieved_at: Optional[str] = None
    state_reg_json: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    signal_word: Optional[str] = None
    rup: Optional[bool] = None
