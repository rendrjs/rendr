#
# Super simple round-robin pool construct
#

#
# standardize simple pool format
#  {items:[a,b,c], current:1}
#
module.exports.create = (itemArray) ->
  pool = 
    items: itemArray


isEmpty = module.exports.isEmpty = (pool) ->
  (!pool || !pool.items || (pool.items.length < 1))

    
#
# increment current counter and return the next item in pool
#
module.exports.next = (pool) ->
  if isEmpty(pool)
    return null 

  if (typeof pool.current == 'undefined')
    pool.current = 0
  else
    pool.current += 1
    if pool.current >= (pool.items.length)
      pool.current = 0

  pool.items[pool.current]


