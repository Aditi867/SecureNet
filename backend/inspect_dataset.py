
import pandas as pd
from pathlib import Path

DATA_PATH = Path(__file__).parent / "data" / "UNSW-NB15_4.csv"

columns = [
    "srcip", "sport", "dstip", "dsport", "proto",
    "state", "dur", "sbytes", "dbytes", "sttl",
    "dttl", "sloss", "dloss", "service", "Sload",
    "Dload", "Spkts", "Dpkts", "swin", "dwin",
    "stcpb", "dtcpb", "smeansz", "dmeansz",
    "trans_depth", "res_bdy_len", "Sjit", "Djit",
    "Stime", "Ltime", "Sintpkt", "Dintpkt",
    "tcprtt", "synack", "ackdat", "is_sm_ips_ports",
    "ct_state_ttl", "ct_flw_http_mthd", "is_ftp_login",
    "ct_ftp_cmd", "ct_srv_src", "ct_srv_dst",
    "ct_dst_ltm", "ct_src_ltm", "ct_src_dport_ltm",
    "ct_dst_sport_ltm", "ct_dst_src_ltm",
    "attack_cat", "label"
]

df = pd.read_csv(DATA_PATH, header=None, names=columns)

print("\nDataset shape:", df.shape)

print("\nColumn names:")
print(df.columns.tolist())

print("\nBinary label distribution:")
print(df["label"].value_counts(dropna=False))

print("\nAttack category distribution:")
print(df["attack_cat"].value_counts(dropna=False))

print("\nMissing values:")
print(df.isnull().sum().sort_values(ascending=False).head(10))
