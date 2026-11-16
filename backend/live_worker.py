
import sys
import json
import time

from nfstream import NFStreamer
from .live_monitor import CAPTURE_INTERFACE
from .live_predict import predict_live_flow


def capture():

    print(
        "Starting live traffic capture...",
        file=sys.stderr,
        flush=True
    )

    streamer = NFStreamer(
        source=CAPTURE_INTERFACE,
        statistical_analysis=True,
        idle_timeout=1,
        active_timeout=5,
        max_nflows=10000
    )

    try:
        for flow in streamer:

            # Extract network flow information
            record = {
                "src_ip": str(flow.src_ip),
                "dst_ip": str(flow.dst_ip),

                "src_port": int(flow.src_port),
                "dst_port": int(flow.dst_port),

                "protocol": int(flow.protocol),

                "packets": int(flow.bidirectional_packets),
                "bytes": int(flow.bidirectional_bytes),
                "duration_ms": float(flow.bidirectional_duration_ms),

                "src_to_dst_packets": int(flow.src2dst_packets),
                "dst_to_src_packets": int(flow.dst2src_packets),

                "src_to_dst_bytes": int(flow.src2dst_bytes),
                "dst_to_src_bytes": int(flow.dst2src_bytes),

                "src_to_dst_mean_packet_size": float(
                    flow.src2dst_mean_ps
                ),
                "dst_to_src_mean_packet_size": float(
                    flow.dst2src_mean_ps
                ),

                "src_to_dst_mean_interarrival_ms": float(
                    flow.src2dst_mean_piat_ms
                ),
                "dst_to_src_mean_interarrival_ms": float(
                    flow.dst2src_mean_piat_ms
                ),

                "syn_packets": int(flow.bidirectional_syn_packets),
                "ack_packets": int(flow.bidirectional_ack_packets),
                "fin_packets": int(flow.bidirectional_fin_packets),
                "rst_packets": int(flow.bidirectional_rst_packets),

                "application": str(flow.application_name),
                "application_category": str(
                    flow.application_category_name
                ),

                "captured_at": time.time()
            }

            # Predict whether the flow is normal or malicious
            try:
                prediction = predict_live_flow(record)
                record.update(prediction)

            except Exception as e:
                record["classification"] = "Error"
                record["prediction_error"] = str(e)

            # Send flow and prediction to the backend controller
            print(json.dumps(record), flush=True)

    except Exception as e:
        print(
            f"Capture error: {e}",
            file=sys.stderr,
            flush=True
        )


if __name__ == "__main__":
    capture()
