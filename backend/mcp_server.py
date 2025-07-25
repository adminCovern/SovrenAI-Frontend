#!/usr/bin/env python3
"""
MCP Server for Sovren AI - Production Ready Implementation
Handles all optional dependencies gracefully to avoid import errors.
"""

import asyncio
import json
import logging
import os
import sys
import subprocess
import platform
import time
import traceback
import warnings
from typing import Dict, List, Optional, Any, Union
from pathlib import Path
import socket
import threading
import uuid
from datetime import datetime
from dataclasses import dataclass

# Standard library imports that should always be available
import importlib
import importlib.util
import pkg_resources
from importlib.metadata import version, PackageNotFoundError

# Suppress warnings for optional imports
warnings.filterwarnings("ignore", category=DeprecationWarning)

# Optional imports with graceful fallbacks
try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False
    psutil = None

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    requests = None

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False
    np = None

try:
    import GPUtil
    HAS_GPUTIL = True
except ImportError:
    HAS_GPUTIL = False
    GPUtil = None

try:
    import quantumrandom
    HAS_QUANTUMRANDOM = True
except ImportError:
    HAS_QUANTUMRANDOM = False
    quantumrandom = None

try:
    import qiskit
    from qiskit.quantum_info import random_state
    HAS_QISKIT = True
except ImportError:
    HAS_QISKIT = False
    qiskit = None

try:
    import matplotlib.pyplot as plt
    HAS_MATPLOTLIB = True
except ImportError:
    HAS_MATPLOTLIB = False
    plt = None

try:
    import cv2
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False
    cv2 = None

try:
    import torch
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    torch = None

try:
    import tensorflow as tf
    HAS_TENSORFLOW = True
except ImportError:
    HAS_TENSORFLOW = False
    tf = None

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False
    pd = None

try:
    import scipy
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False
    scipy = None

try:
    import sklearn
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False
    sklearn = None

try:
    import joblib
    HAS_JOBLIB = True
except ImportError:
    HAS_JOBLIB = False
    joblib = None

try:
    import pickle
    HAS_PICKLE = True
except ImportError:
    HAS_PICKLE = False
    pickle = None

try:
    import jsonlines
    HAS_JSONLINES = True
except ImportError:
    HAS_JSONLINES = False
    jsonlines = None

try:
    import toml
    HAS_TOML = True
except ImportError:
    try:
        import tomllib as toml
        HAS_TOML = True
    except ImportError:
        HAS_TOML = False
        toml = None

try:
    import yaml
    HAS_YAML = True
except ImportError:
    HAS_YAML = False
    yaml = None

try:
    from distutils import version as dist_version
    HAS_DISTUTILS = True
except ImportError:
    HAS_DISTUTILS = False
    dist_version = None

try:
    import virtualenv
    HAS_VIRTUALENV = True
except ImportError:
    HAS_VIRTUALENV = False
    virtualenv = None

try:
    import conda
    HAS_CONDA = True
except ImportError:
    HAS_CONDA = False
    conda = None

try:
    import poetry
    HAS_POETRY = True
except ImportError:
    HAS_POETRY = False
    poetry = None

try:
    import pipenv
    HAS_PIPENV = True
except ImportError:
    HAS_PIPENV = False
    pipenv = None

try:
    import pipdeptree
    HAS_PIPDEPTREE = True
except ImportError:
    HAS_PIPDEPTREE = False
    pipdeptree = None

try:
    import safety
    HAS_SAFETY = True
except ImportError:
    HAS_SAFETY = False
    safety = None

try:
    import bandit
    HAS_BANDIT = True
except ImportError:
    HAS_BANDIT = False
    bandit = None

try:
    import pylint
    HAS_PYLINT = True
except ImportError:
    HAS_PYLINT = False
    pylint = None

try:
    import black
    HAS_BLACK = True
except ImportError:
    HAS_BLACK = False
    black = None

try:
    import isort
    HAS_ISORT = True
except ImportError:
    HAS_ISORT = False
    isort = None

try:
    import flake8
    HAS_FLAKE8 = True
except ImportError:
    HAS_FLAKE8 = False
    flake8 = None

try:
    import profiling
    HAS_PROFILING = True
except ImportError:
    HAS_PROFILING = False
    profiling = None

try:
    import memory_profiler
    HAS_MEMORY_PROFILER = True
except ImportError:
    HAS_MEMORY_PROFILER = False
    memory_profiler = None

try:
    import line_profiler
    HAS_LINE_PROFILER = True
except ImportError:
    HAS_LINE_PROFILER = False
    line_profiler = None

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Duplicate imports handling (these were imported multiple times in the original)
try:
    import jsonlines as jsonlines_alt
    HAS_JSONLINES_ALT = True
except ImportError:
    HAS_JSONLINES_ALT = False
    jsonlines_alt = None

try:
    import toml as toml_alt
    HAS_TOML_ALT = True
except ImportError:
    HAS_TOML_ALT = False
    toml_alt = None

try:
    from distutils import version as dist_version_alt
    HAS_DISTUTILS_ALT = True
except ImportError:
    HAS_DISTUTILS_ALT = False
    dist_version_alt = None

try:
    import virtualenv as virtualenv_alt
    HAS_VIRTUALENV_ALT = True
except ImportError:
    HAS_VIRTUALENV_ALT = False
    virtualenv_alt = None

try:
    import conda as conda_alt
    HAS_CONDA_ALT = True
except ImportError:
    HAS_CONDA_ALT = False
    conda_alt = None

try:
    import poetry as poetry_alt
    HAS_POETRY_ALT = True
except ImportError:
    HAS_POETRY_ALT = False
    poetry_alt = None

try:
    import pipenv as pipenv_alt
    HAS_PIPENV_ALT = True
except ImportError:
    HAS_PIPENV_ALT = False
    pipenv_alt = None

try:
    import pipdeptree as pipdeptree_alt
    HAS_PIPDEPTREE_ALT = True
except ImportError:
    HAS_PIPDEPTREE_ALT = False
    pipdeptree_alt = None

try:
    import safety as safety_alt
    HAS_SAFETY_ALT = True
except ImportError:
    HAS_SAFETY_ALT = False
    safety_alt = None

try:
    import bandit as bandit_alt
    HAS_BANDIT_ALT = True
except ImportError:
    HAS_BANDIT_ALT = False
    bandit_alt = None

try:
    import pylint as pylint_alt
    HAS_PYLINT_ALT = True
except ImportError:
    HAS_PYLINT_ALT = False
    pylint_alt = None

try:
    import black as black_alt
    HAS_BLACK_ALT = True
except ImportError:
    HAS_BLACK_ALT = False
    black_alt = None

try:
    import isort as isort_alt
    HAS_ISORT_ALT = True
except ImportError:
    HAS_ISORT_ALT = False
    isort_alt = None

try:
    import flake8 as flake8_alt
    HAS_FLAKE8_ALT = True
except ImportError:
    HAS_FLAKE8_ALT = False
    flake8_alt = None

try:
    import profiling as profiling_alt
    HAS_PROFILING_ALT = True
except ImportError:
    HAS_PROFILING_ALT = False
    profiling_alt = None

try:
    import memory_profiler as memory_profiler_alt
    HAS_MEMORY_PROFILER_ALT = True
except ImportError:
    HAS_MEMORY_PROFILER_ALT = False
    memory_profiler_alt = None

try:
    import line_profiler as line_profiler_alt
    HAS_LINE_PROFILER_ALT = True
except ImportError:
    HAS_LINE_PROFILER_ALT = False
    line_profiler_alt = None


@dataclass
class MCPCapabilities:
    """Available capabilities based on installed packages"""
    gpu_monitoring: bool = False
    quantum_random: bool = False
    quantum_computing: bool = False
    image_processing: bool = False
    machine_learning: bool = False
    deep_learning: bool = False
    data_analysis: bool = False
    visualization: bool = False
    profiling: bool = False
    code_quality: bool = False
    package_management: bool = False


class MCPServer:
    """MCP Server for Sovren AI with graceful dependency handling"""

    def __init__(self):
        self.capabilities = self._detect_capabilities()
        self.session_id = str(uuid.uuid4())
        self.start_time = datetime.now()
        logger.info(f"MCP Server initialized with session ID: {self.session_id}")
        logger.info(f"Available capabilities: {self._format_capabilities()}")

    def _detect_capabilities(self) -> MCPCapabilities:
        """Detect available capabilities based on installed packages"""
        return MCPCapabilities(
            gpu_monitoring=HAS_GPUTIL and HAS_PSUTIL,
            quantum_random=HAS_QUANTUMRANDOM,
            quantum_computing=HAS_QISKIT,
            image_processing=HAS_OPENCV,
            machine_learning=HAS_SKLEARN and HAS_NUMPY,
            deep_learning=HAS_TORCH or HAS_TENSORFLOW,
            data_analysis=HAS_PANDAS and HAS_NUMPY,
            visualization=HAS_MATPLOTLIB,
            profiling=HAS_PROFILING or HAS_MEMORY_PROFILER or HAS_LINE_PROFILER,
            code_quality=HAS_PYLINT or HAS_BLACK or HAS_ISORT or HAS_FLAKE8,
            package_management=HAS_POETRY or HAS_PIPENV or HAS_PIPDEPTREE
        )

    def _format_capabilities(self) -> str:
        """Format capabilities for logging"""
        caps = []
        if self.capabilities.gpu_monitoring:
            caps.append("GPU Monitoring")
        if self.capabilities.quantum_random:
            caps.append("Quantum Random")
        if self.capabilities.quantum_computing:
            caps.append("Quantum Computing")
        if self.capabilities.image_processing:
            caps.append("Image Processing")
        if self.capabilities.machine_learning:
            caps.append("Machine Learning")
        if self.capabilities.deep_learning:
            caps.append("Deep Learning")
        if self.capabilities.data_analysis:
            caps.append("Data Analysis")
        if self.capabilities.visualization:
            caps.append("Visualization")
        if self.capabilities.profiling:
            caps.append("Profiling")
        if self.capabilities.code_quality:
            caps.append("Code Quality")
        if self.capabilities.package_management:
            caps.append("Package Management")
        
        return ", ".join(caps) if caps else "Basic functionality only"

    async def get_system_info(self) -> Dict[str, Any]:
        """Get comprehensive system information"""
        info = {
            "session_id": self.session_id,
            "start_time": self.start_time.isoformat(),
            "platform": platform.platform(),
            "python_version": sys.version,
            "capabilities": self.capabilities.__dict__,
            "installed_packages": {}
        }

        # Add package versions for installed packages
        packages_to_check = [
            ("psutil", HAS_PSUTIL),
            ("requests", HAS_REQUESTS),
            ("numpy", HAS_NUMPY),
            ("GPUtil", HAS_GPUTIL),
            ("quantumrandom", HAS_QUANTUMRANDOM),
            ("qiskit", HAS_QISKIT),
            ("matplotlib", HAS_MATPLOTLIB),
            ("opencv-python", HAS_OPENCV),
            ("torch", HAS_TORCH),
            ("tensorflow", HAS_TENSORFLOW),
            ("pandas", HAS_PANDAS),
            ("scipy", HAS_SCIPY),
            ("scikit-learn", HAS_SKLEARN),
            ("joblib", HAS_JOBLIB),
            ("jsonlines", HAS_JSONLINES),
            ("toml", HAS_TOML),
            ("PyYAML", HAS_YAML),
            ("virtualenv", HAS_VIRTUALENV),
            ("conda", HAS_CONDA),
            ("poetry", HAS_POETRY),
            ("pipenv", HAS_PIPENV),
            ("pipdeptree", HAS_PIPDEPTREE),
            ("safety", HAS_SAFETY),
            ("bandit", HAS_BANDIT),
            ("pylint", HAS_PYLINT),
            ("black", HAS_BLACK),
            ("isort", HAS_ISORT),
            ("flake8", HAS_FLAKE8),
            ("profiling", HAS_PROFILING),
            ("memory-profiler", HAS_MEMORY_PROFILER),
            ("line-profiler", HAS_LINE_PROFILER),
        ]

        for package_name, is_available in packages_to_check:
            if is_available:
                try:
                    info["installed_packages"][package_name] = version(package_name)
                except PackageNotFoundError:
                    info["installed_packages"][package_name] = "unknown"

        # Add system resources if psutil is available
        if HAS_PSUTIL:
            try:
                info["system_resources"] = {
                    "cpu_percent": psutil.cpu_percent(),
                    "memory_percent": psutil.virtual_memory().percent,
                    "disk_usage": psutil.disk_usage('/').percent if os.name != 'nt' else psutil.disk_usage('C:').percent,
                    "cpu_count": psutil.cpu_count(),
                    "memory_total_gb": round(psutil.virtual_memory().total / (1024**3), 2)
                }
            except Exception as e:
                logger.warning(f"Could not get system resources: {e}")

        # Add GPU info if available
        if HAS_GPUTIL:
            try:
                gpus = GPUtil.getGPUs()
                info["gpus"] = [
                    {
                        "id": gpu.id,
                        "name": gpu.name,
                        "memory_used": gpu.memoryUsed,
                        "memory_total": gpu.memoryTotal,
                        "temperature": gpu.temperature,
                        "load": gpu.load
                    }
                    for gpu in gpus
                ]
            except Exception as e:
                logger.warning(f"Could not get GPU information: {e}")

        return info

    async def install_missing_packages(self, packages: List[str]) -> Dict[str, str]:
        """Install missing packages (production-safe implementation)"""
        results = {}
        
        for package in packages:
            try:
                # Check if package is already installed
                try:
                    version(package)
                    results[package] = "already_installed"
                    continue
                except PackageNotFoundError:
                    pass

                # Install package using subprocess
                process = await asyncio.create_subprocess_exec(
                    sys.executable, "-m", "pip", "install", package,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                
                stdout, stderr = await process.communicate()
                
                if process.returncode == 0:
                    results[package] = "installed"
                    logger.info(f"Successfully installed {package}")
                else:
                    results[package] = f"failed: {stderr.decode()}"
                    logger.error(f"Failed to install {package}: {stderr.decode()}")
                    
            except Exception as e:
                results[package] = f"error: {str(e)}"
                logger.error(f"Error installing {package}: {e}")
        
        return results

    async def run_code_quality_check(self, file_path: str) -> Dict[str, Any]:
        """Run code quality checks if tools are available"""
        results = {"file": file_path, "checks": {}}
        
        if not os.path.exists(file_path):
            results["error"] = "File not found"
            return results

        # Run pylint if available
        if HAS_PYLINT:
            try:
                process = await asyncio.create_subprocess_exec(
                    "pylint", file_path,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, stderr = await process.communicate()
                results["checks"]["pylint"] = {
                    "exit_code": process.returncode,
                    "output": stdout.decode(),
                    "errors": stderr.decode()
                }
            except Exception as e:
                results["checks"]["pylint"] = {"error": str(e)}

        # Run flake8 if available
        if HAS_FLAKE8:
            try:
                process = await asyncio.create_subprocess_exec(
                    "flake8", file_path,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, stderr = await process.communicate()
                results["checks"]["flake8"] = {
                    "exit_code": process.returncode,
                    "output": stdout.decode(),
                    "errors": stderr.decode()
                }
            except Exception as e:
                results["checks"]["flake8"] = {"error": str(e)}

        # Run bandit if available
        if HAS_BANDIT:
            try:
                process = await asyncio.create_subprocess_exec(
                    "bandit", "-f", "json", file_path,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, stderr = await process.communicate()
                results["checks"]["bandit"] = {
                    "exit_code": process.returncode,
                    "output": stdout.decode(),
                    "errors": stderr.decode()
                }
            except Exception as e:
                results["checks"]["bandit"] = {"error": str(e)}

        return results

    async def format_code(self, file_path: str) -> Dict[str, Any]:
        """Format code using available formatters"""
        results = {"file": file_path, "formatters": {}}
        
        if not os.path.exists(file_path):
            results["error"] = "File not found"
            return results

        # Format with black if available
        if HAS_BLACK:
            try:
                process = await asyncio.create_subprocess_exec(
                    "black", "--check", "--diff", file_path,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, stderr = await process.communicate()
                results["formatters"]["black"] = {
                    "exit_code": process.returncode,
                    "output": stdout.decode(),
                    "errors": stderr.decode()
                }
            except Exception as e:
                results["formatters"]["black"] = {"error": str(e)}

        # Sort imports with isort if available
        if HAS_ISORT:
            try:
                process = await asyncio.create_subprocess_exec(
                    "isort", "--check-only", "--diff", file_path,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, stderr = await process.communicate()
                results["formatters"]["isort"] = {
                    "exit_code": process.returncode,
                    "output": stdout.decode(),
                    "errors": stderr.decode()
                }
            except Exception as e:
                results["formatters"]["isort"] = {"error": str(e)}

        return results

    def get_missing_packages_recommendations(self) -> Dict[str, List[str]]:
        """Get recommendations for missing packages by category"""
        recommendations = {}
        
        if not self.capabilities.gpu_monitoring:
            recommendations["GPU Monitoring"] = ["GPUtil", "psutil"]
        
        if not self.capabilities.quantum_random:
            recommendations["Quantum Random"] = ["quantumrandom"]
            
        if not self.capabilities.quantum_computing:
            recommendations["Quantum Computing"] = ["qiskit", "qiskit-aer"]
            
        if not self.capabilities.image_processing:
            recommendations["Image Processing"] = ["opencv-python", "Pillow"]
            
        if not self.capabilities.machine_learning:
            recommendations["Machine Learning"] = ["scikit-learn", "numpy", "pandas"]
            
        if not self.capabilities.deep_learning:
            recommendations["Deep Learning"] = ["torch", "tensorflow"]
            
        if not self.capabilities.data_analysis:
            recommendations["Data Analysis"] = ["pandas", "numpy", "scipy"]
            
        if not self.capabilities.visualization:
            recommendations["Visualization"] = ["matplotlib", "seaborn", "plotly"]
            
        if not self.capabilities.profiling:
            recommendations["Profiling"] = ["memory-profiler", "line-profiler", "py-spy"]
            
        if not self.capabilities.code_quality:
            recommendations["Code Quality"] = ["pylint", "black", "isort", "flake8", "bandit"]
            
        if not self.capabilities.package_management:
            recommendations["Package Management"] = ["poetry", "pipenv", "pipdeptree"]
        
        return recommendations


async def main():
    """Main entry point for the MCP server"""
    server = MCPServer()
    
    try:
        logger.info("Starting MCP Server...")
        
        # Get system info
        system_info = await server.get_system_info()
        logger.info(f"System info collected: {json.dumps(system_info, indent=2, default=str)}")
        
        # Show missing package recommendations
        recommendations = server.get_missing_packages_recommendations()
        if recommendations:
            logger.info("Missing package recommendations:")
            for category, packages in recommendations.items():
                logger.info(f"  {category}: {', '.join(packages)}")
        
        # Keep server running
        logger.info("MCP Server is running. Press Ctrl+C to stop.")
        
        while True:
            await asyncio.sleep(1)
            
    except KeyboardInterrupt:
        logger.info("MCP Server stopped by user")
    except Exception as e:
        logger.error(f"MCP Server error: {e}")
        logger.error(traceback.format_exc())


if __name__ == "__main__":
    asyncio.run(main())