from fastapi import FastAPI

app = FastAPI()


@app.get("/")
async def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
async def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}

@app.get("/ai")
async def generate_itinerary(context: str):
    # send ai the context (maybe format it first)
    
    # ai will generate an itinerary, maybe asking for more info or something like that
    
    # needs to be in a specific json format like:
    # {
    #   flights: [
    #       {
    #           type: departure,
    #           url: blahblahblah.com/flight10101001,
    #           source: newark,
    #           destination: bali,
    #           length: 2 billion hours,
    #           cost: 1 dolla,
    #           airline: jetblue,
    #           other_info: YAY
    #       },
    #       {
    #           type: return,
    #           blahblahblah....
    #       }
    #   ],
    #   hotels: [],
    #   events: [],
    #   timeline: [],
    #   other_stuff: ...
    # }
    
    # validate json format, if incorrect maybe retry?

    # return formatted itinerary
    return {"response": "How can I help you?"}
