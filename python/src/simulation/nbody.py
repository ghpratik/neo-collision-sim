"""
src/simulation/nbody.py

STATUS: NOT EXECUTED IN THIS ENVIRONMENT -- rebound could not be installed
here (no network access in this sandbox). Written against rebound's
documented public API (rebound >= 3.x). TEST LOCALLY before relying on
this module.

WHY N-BODY AT ALL (given the project already has a validated two-body
propagator): the two-body Kepler propagator (kepler_propagator.py) ignores
gravitational perturbations from OTHER planets -- this is exactly why our
Apophis simulation's nominal closest-approach estimate (~298,700 km)
disagreed with JPL's real, fully-perturbed value (~38,000 km) over the
~8.3-year propagation. A full N-body integration (Sun + all planets + the
asteroid) should close most of that gap. This module exists to let you
verify that explanation directly: run the SAME Apophis scenario through
rebound and compare its closest-approach result to both (a) our two-body
result and (b) JPL's published value.

INSTALL: pip install rebound
(rebound is a C-based N-body integrator with Python bindings; installation
requires a working C compiler, which is standard on Mac/Linux and usually
fine on Windows with the Microsoft C++ Build Tools installed.)
"""
import numpy as np

try:
    import rebound
    REBOUND_AVAILABLE = True
except ImportError:
    REBOUND_AVAILABLE = False

# Standard JPL DE-series planetary GM values (km^3/s^2), for reference if
# manually configuring units -- rebound's built-in 'horizons' lookup
# fetches these automatically when used as shown below.
PLANET_NAMES = ["Sun", "Mercury", "Venus", "399", "499", "599", "699", "799", "899"]
# '399'=Earth, '499'=Mars, '599'=Jupiter, '699'=Saturn, '799'=Uranus, '899'=Neptune
# (Horizons body ID codes; using IDs instead of names avoids ambiguity with
# barycenters vs body centers)


def build_solar_system_sim(epoch_jd: float, include_bodies: list = None,
                              target_body: str = None) -> "rebound.Simulation":
    """
    Build a rebound N-body Simulation initialized from real JPL Horizons
    ephemeris data at a given epoch.

    Parameters
    ----------
    epoch_jd : Julian Date for the initial state.
    include_bodies : list of Horizons body IDs/names to include (defaults
        to Sun + all 8 planets if None).
    target_body : optional additional small-body designation (e.g.
        "99942" for Apophis) to add to the simulation alongside the planets.

    Returns
    -------
    rebound.Simulation, with units AU / day / solar masses (rebound's
    'AU/day/Msun' unit system, chosen to match kepler_propagator.py's
    conventions for easy comparison).

    NOTE: rebound's sim.add(target_body, date=...) call fetches live data
    from JPL Horizons over the network at run-time -- an internet
    connection is required when this function actually runs, not just at
    install time.
    """
    if not REBOUND_AVAILABLE:
        raise ImportError("rebound is not installed. Run: pip install rebound")

    if include_bodies is None:
        include_bodies = PLANET_NAMES

    sim = rebound.Simulation()
    sim.units = ("AU", "day", "Msun")

    # rebound's horizons-lookup date format is "YYYY-MM-DD HH:MM"
    from astropy.time import Time
    date_str = Time(epoch_jd, format="jd").iso[:16]

    for body in include_bodies:
        sim.add(body, date=date_str)
    if target_body:
        sim.add(target_body, date=date_str)

    sim.move_to_com()  # integrate in the center-of-mass frame
    return sim


def integrate_and_track_distance(sim: "rebound.Simulation", target_index: int, earth_index: int,
                                     t_start_days: float, t_end_days: float, n_steps: int = 2000) -> dict:
    """
    Integrate a rebound simulation forward and track the distance between
    two bodies (e.g. the target asteroid and Earth) at each output step.

    Parameters
    ----------
    target_index, earth_index : integer indices into sim.particles for the
        asteroid and Earth respectively (depends on the order bodies were
        added in build_solar_system_sim -- print sim.particles to check).
    t_start_days, t_end_days : integration window, in days from sim.t=0.
    n_steps : number of output samples.

    Returns
    -------
    dict with 'times_jd' (relative), 'distances_au', 'min_distance_au',
    'min_distance_km', 'min_time_index'.
    """
    if not REBOUND_AVAILABLE:
        raise ImportError("rebound is not installed.")

    times = np.linspace(t_start_days, t_end_days, n_steps)
    distances = np.zeros(n_steps)

    for k, t in enumerate(times):
        sim.integrate(t)
        p_target = sim.particles[target_index]
        p_earth = sim.particles[earth_index]
        dx, dy, dz = p_target.x - p_earth.x, p_target.y - p_earth.y, p_target.z - p_earth.z
        distances[k] = np.sqrt(dx ** 2 + dy ** 2 + dz ** 2)

    imin = int(np.argmin(distances))
    AU_KM = 1.495978707e8
    return {
        "times_days": times, "distances_au": distances,
        "min_distance_au": distances[imin], "min_distance_km": distances[imin] * AU_KM,
        "min_time_index": imin,
    }


if __name__ == "__main__":
    if not REBOUND_AVAILABLE:
        print("rebound not installed -- install it to run this test: pip install rebound")
        print("\nIntended usage once installed:")
        print("  sim = build_solar_system_sim(epoch_jd=2459215.5, target_body='99942')")
        print("  result = integrate_and_track_distance(sim, target_index=9, earth_index=3,")
        print("                                          t_start_days=0, t_end_days=3000)")
        print("  print(f\"Min distance: {result['min_distance_km']:,.0f} km\")")
        print("  # Compare this to the two-body result (~298,700 km) and JPL's value (~38,000 km)")
    else:
        print("Building solar system simulation including Apophis, epoch 2021-Jan-01...")
        sim = build_solar_system_sim(epoch_jd=2459215.5, target_body="99942")
        print(f"Bodies in simulation: {[p.hash for p in sim.particles]}")
        print("Run integrate_and_track_distance() next with the correct particle")
        print("indices (print sim.particles to confirm order) to find Apophis's")
        print("simulated closest approach to Earth in 2029, with full planetary")
        print("perturbations included -- compare against the two-body result.")
