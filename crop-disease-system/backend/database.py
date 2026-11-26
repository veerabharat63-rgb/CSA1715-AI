"""
Async SQLite database layer for the crop disease detection system.
Backed by Python's standard library sqlite3 with asyncio non-blocking execution.
"""

from __future__ import annotations

import json
import os
import sqlite3
import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, List, Dict, Optional

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(__file__), "crop_disease.db")


def _get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    return conn


def _sync_init_db() -> None:
    conn = _get_connection()
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS diagnoses (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp       TEXT    NOT NULL,
                image_name      TEXT    NOT NULL,
                prediction      TEXT    NOT NULL,
                confidence      REAL    NOT NULL,
                severity        REAL    NOT NULL,
                bbox_json       TEXT    NOT NULL DEFAULT '[]',
                advice          TEXT    NOT NULL DEFAULT '',
                gradcam_path    TEXT    NOT NULL DEFAULT ''
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS missions (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp           TEXT    NOT NULL,
                plant_id            TEXT    NOT NULL,
                row                 INTEGER NOT NULL,
                col                 INTEGER NOT NULL,
                disease             TEXT    NOT NULL,
                severity            REAL    NOT NULL,
                dose_ml             REAL    NOT NULL,
                chemical_saved_pct  REAL    NOT NULL DEFAULT 0.0,
                weather             TEXT    NOT NULL DEFAULT '',
                inference_ms        REAL    NOT NULL DEFAULT 0.0
            )
        """)
        conn.commit()
    finally:
        conn.close()


async def init_db() -> None:
    """Create the database tables if they do not already exist."""
    await asyncio.to_thread(_sync_init_db)
    logger.info("Database initialised at %s", DB_PATH)


# ---------------------------------------------------------------------------
# Diagnosis CRUD
# ---------------------------------------------------------------------------

def _sync_save_diagnosis(
    image_name: str,
    prediction: str,
    confidence: float,
    severity: float,
    bbox_json: str,
    advice: str,
    gradcam_path: str,
) -> int:
    now = datetime.now(timezone.utc).isoformat()
    conn = _get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO diagnoses
                (timestamp, image_name, prediction, confidence, severity,
                 bbox_json, advice, gradcam_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (now, image_name, prediction, confidence, severity, bbox_json, advice, gradcam_path),
        )
        conn.commit()
        return cur.lastrowid
    finally:
        conn.close()


async def save_diagnosis(
    image_name: str,
    prediction: str,
    confidence: float,
    severity: float,
    bbox: Optional[List[Any]] = None,
    advice: str = "",
    gradcam_path: str = "",
) -> int:
    """Insert a new diagnosis record and return its row id."""
    bbox_json = json.dumps(bbox or [])
    row_id = await asyncio.to_thread(
        _sync_save_diagnosis,
        image_name, prediction, confidence, severity, bbox_json, advice, gradcam_path
    )
    return row_id


def _sync_get_diagnoses(limit: int) -> List[Dict[str, Any]]:
    conn = _get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM diagnoses ORDER BY id DESC LIMIT ?", (limit,))
        rows = cur.fetchall()
        return [
            {
                "id": r["id"],
                "timestamp": r["timestamp"],
                "image_name": r["image_name"],
                "prediction": r["prediction"],
                "confidence": r["confidence"],
                "severity": r["severity"],
                "bbox": json.loads(r["bbox_json"]),
                "advice": r["advice"],
                "gradcam_path": r["gradcam_path"],
            }
            for r in rows
        ]
    finally:
        conn.close()


async def get_diagnoses(limit: int = 50) -> List[Dict[str, Any]]:
    """Return the most recent *limit* diagnosis records (newest first)."""
    return await asyncio.to_thread(_sync_get_diagnoses, limit)


# ---------------------------------------------------------------------------
# Mission CRUD
# ---------------------------------------------------------------------------

def _sync_save_mission(
    plant_id: str,
    row: int,
    col: int,
    disease: str,
    severity: float,
    dose_ml: float,
    chemical_saved_pct: float,
    weather: str,
    inference_ms: float,
) -> int:
    now = datetime.now(timezone.utc).isoformat()
    conn = _get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO missions
                (timestamp, plant_id, row, col, disease, severity,
                 dose_ml, chemical_saved_pct, weather, inference_ms)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (now, plant_id, row, col, disease, severity, dose_ml, chemical_saved_pct, weather, inference_ms),
        )
        conn.commit()
        return cur.lastrowid
    finally:
        conn.close()


async def save_mission(
    plant_id: str,
    row: int,
    col: int,
    disease: str,
    severity: float,
    dose_ml: float,
    chemical_saved_pct: float = 0.0,
    weather: str = "",
    inference_ms: float = 0.0,
) -> int:
    """Insert a new mission record and return its row id."""
    row_id = await asyncio.to_thread(
        _sync_save_mission,
        plant_id, row, col, disease, severity, dose_ml, chemical_saved_pct, weather, inference_ms
    )
    return row_id


def _sync_get_missions(limit: int) -> List[Dict[str, Any]]:
    conn = _get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM missions ORDER BY id DESC LIMIT ?", (limit,))
        rows = cur.fetchall()
        return [
            {
                "id": r["id"],
                "timestamp": r["timestamp"],
                "plant_id": r["plant_id"],
                "row": r["row"],
                "col": r["col"],
                "disease": r["disease"],
                "severity": r["severity"],
                "dose_ml": r["dose_ml"],
                "chemical_saved_pct": r["chemical_saved_pct"],
                "weather": r["weather"],
                "inference_ms": r["inference_ms"],
            }
            for r in rows
        ]
    finally:
        conn.close()


async def get_missions(limit: int = 100) -> List[Dict[str, Any]]:
    """Return the most recent *limit* mission records (newest first)."""
    return await asyncio.to_thread(_sync_get_missions, limit)
