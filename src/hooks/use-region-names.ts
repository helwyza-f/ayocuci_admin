"use client";

import { useEffect, useMemo, useState } from "react";

type RegionSource = {
  ot_provinsi?: string | null;
  ot_kota?: string | null;
  ot_kecamatan?: string | null;
};

type RegionRow = {
  id: string;
  nama: string;
};

type RegionMaps = {
  provinces: Map<string, string>;
  cities: Map<string, string>;
  districts: Map<string, string>;
};

const EMPTY_MAPS: RegionMaps = {
  provinces: new Map(),
  cities: new Map(),
  districts: new Map(),
};

const DATA_BASE_URL = "https://ibnux.github.io/data-indonesia";

function cleanCode(value?: string | null) {
  return String(value ?? "").trim();
}

function normalizeCode(value?: string | null) {
  return cleanCode(value).replace(/\./g, "");
}

function isRegionCode(value?: string | null) {
  const code = cleanCode(value);
  return code !== "" && /^[\d.]+$/.test(code);
}

async function fetchRegionRows(path: string): Promise<RegionRow[]> {
  const res = await fetch(`${DATA_BASE_URL}/${path}`);
  if (!res.ok) return [];
  return res.json();
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map(normalizeCode).filter(Boolean)));
}

export function useRegionNames(sources: RegionSource[]) {
  const [maps, setMaps] = useState<RegionMaps>(EMPTY_MAPS);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedKey, setLoadedKey] = useState("");

  const regionKey = useMemo(() => {
    const parts = sources.flatMap((item) => [
      item.ot_provinsi,
      item.ot_kota,
      item.ot_kecamatan,
    ]);
    return unique(parts).sort().join("|");
  }, [sources]);

  useEffect(() => {
    let canceled = false;

    async function load() {
      setIsLoading(true);
      const provinceCodes = unique(sources.map((item) => item.ot_provinsi));
      const cityCodes = unique(sources.map((item) => item.ot_kota));
      const districtCodes = unique(sources.map((item) => item.ot_kecamatan));

      const nextMaps: RegionMaps = {
        provinces: new Map(),
        cities: new Map(),
        districts: new Map(),
      };

      try {
        const provinces = await fetchRegionRows("provinsi.json");
        provinces.forEach((row) => nextMaps.provinces.set(row.id, row.nama));

        await Promise.all(
          provinceCodes.map(async (provinceCode) => {
            const cities = await fetchRegionRows(`kabupaten/${provinceCode}.json`);
            cities.forEach((row) => nextMaps.cities.set(row.id, row.nama));
          }),
        );

        const cityParents = unique(
          sources
            .filter((item) => normalizeCode(item.ot_kecamatan))
            .map((item) => item.ot_kota),
        );

        await Promise.all(
          cityParents.map(async (cityCode) => {
            const districts = await fetchRegionRows(`kecamatan/${cityCode}.json`);
            districts.forEach((row) => nextMaps.districts.set(row.id, row.nama));
          }),
        );

        cityCodes.forEach((code) => {
          if (!nextMaps.cities.has(code)) nextMaps.cities.set(code, code);
        });
        districtCodes.forEach((code) => {
          if (!nextMaps.districts.has(code)) nextMaps.districts.set(code, code);
        });

        if (!canceled) setMaps(nextMaps);
      } catch {
        if (!canceled) setMaps(EMPTY_MAPS);
      } finally {
        if (!canceled) {
          setLoadedKey(regionKey);
          setIsLoading(false);
        }
      }
    }

    if (regionKey) {
      load();
    } else {
      setMaps(EMPTY_MAPS);
      setLoadedKey("");
      setIsLoading(false);
    }

    return () => {
      canceled = true;
    };
  }, [regionKey, sources]);

  return useMemo(
    () => ({
      provinceName: (code?: string | null) => {
        if (!isRegionCode(code)) return cleanCode(code);
        return maps.provinces.get(normalizeCode(code)) || cleanCode(code);
      },
      cityName: (code?: string | null) => {
        if (!isRegionCode(code)) return cleanCode(code);
        return maps.cities.get(normalizeCode(code)) || cleanCode(code);
      },
      districtName: (code?: string | null) => {
        if (!isRegionCode(code)) return cleanCode(code);
        return maps.districts.get(normalizeCode(code)) || cleanCode(code);
      },
      isLoading: isLoading || (regionKey !== "" && loadedKey !== regionKey),
    }),
    [isLoading, loadedKey, maps, regionKey],
  );
}
