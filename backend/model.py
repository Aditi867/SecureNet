import torch
import torch.nn as nn


class BinaryClassifier(nn.Module):

    def __init__(self, input_size):

        super(BinaryClassifier, self).__init__()

        self.network = nn.Sequential(

            nn.Linear(input_size, 128),
            nn.ReLU(),

            nn.Linear(128, 64),
            nn.ReLU(),

            nn.Linear(64, 32),
            nn.ReLU(),

            nn.Linear(32, 1)
        )

    def forward(self, x):

        return self.network(x)

class MultiClassClassifier(nn.Module):

    def __init__(self, input_size, num_classes):

        super(MultiClassClassifier, self).__init__()

        self.network = nn.Sequential(

            nn.Linear(input_size, 128),
            nn.ReLU(),

            nn.Linear(128, 64),
            nn.ReLU(),

            nn.Linear(64, 32),
            nn.ReLU(),

            nn.Linear(32, num_classes)
        )

    def forward(self, x):

        return self.network(x)