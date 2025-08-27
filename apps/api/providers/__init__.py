class WeatherProvider:
  async def get_hourly(self, lat: float, lon: float, start, end):
    raise NotImplementedError

  async def health_check(self) -> bool:
    return True

