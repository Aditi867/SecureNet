
from nfstream import NFStreamer


# Your laptop's Wi-Fi adapter
CAPTURE_INTERFACE = (
    r"\Device\NPF_{1D6EE348-3D5C-45E2-A057-E3A547CA4FDE}"
)


def capture_live_flows(max_flows=20, duration=30):

    print("Starting live network monitoring...")
    print("Capture duration:", duration, "seconds")

    streamer = NFStreamer(
        source=CAPTURE_INTERFACE,
        statistical_analysis=True
    )

    flows = []

    try:
        for flow in streamer:

            flows.append(flow)

            print(
                f"Flow {len(flows)} | "
                f"{flow.src_ip}:{flow.src_port} -> "
                f"{flow.dst_ip}:{flow.dst_port} | "
                f"Protocol: {flow.protocol} | "
                f"Packets: {flow.bidirectional_packets} | "
                f"Bytes: {flow.bidirectional_bytes}"
            )

            if len(flows) >= max_flows:
                break

    except Exception as e:
        print("Capture error:", e)

    print("\nMonitoring completed.")
    print("Total flows captured:", len(flows))

    return flows
